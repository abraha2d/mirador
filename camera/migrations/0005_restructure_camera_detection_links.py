# Generated by Django 3.1.5 on 2021-01-23 02:13

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('camera', '0004_update_verbose_names'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='camera',
            name='alpr_settings',
        ),
        migrations.RemoveField(
            model_name='camera',
            name='face_detection_settings',
        ),
        migrations.RemoveField(
            model_name='camera',
            name='motion_detection_settings',
        ),
        migrations.RemoveField(
            model_name='camera',
            name='object_detection_settings',
        ),
        migrations.RemoveField(
            model_name='camera',
            name='require_motion_to_detect',
        ),
        migrations.RemoveField(
            model_name='camera',
            name='sound_detection_settings',
        ),
        migrations.RemoveField(
            model_name='cameratype',
            name='ptz_settings',
        ),
        migrations.AddField(
            model_name='ptzsettings',
            name='camera_type',
            field=models.OneToOneField(default=None, on_delete=django.db.models.deletion.CASCADE, to='camera.cameratype'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='camera',
            name='enabled',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name='ptzsettings',
            name='enabled',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name='stream',
            name='enabled',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name='stream',
            name='port',
            field=models.PositiveSmallIntegerField(default=554),
        ),
        migrations.AlterField(
            model_name='stream',
            name='protocol',
            field=models.CharField(choices=[('RTSP', 'RTSP'), ('HTTP', 'HTTP')], default='RTSP', max_length=4),
        ),
    ]
