# Generated by Django 3.1.5 on 2021-01-23 02:13

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('camera', '0005_restructure_camera_detection_links'),
        ('detection', '0003_update_verbose_names'),
    ]

    operations = [
        migrations.AddField(
            model_name='alprsettings',
            name='camera',
            field=models.OneToOneField(default=None, on_delete=django.db.models.deletion.CASCADE, to='camera.camera'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='facedetectionsettings',
            name='camera',
            field=models.OneToOneField(default=None, on_delete=django.db.models.deletion.CASCADE, to='camera.camera'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='motiondetectionsettings',
            name='camera',
            field=models.OneToOneField(default=None, on_delete=django.db.models.deletion.CASCADE, to='camera.camera'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='objectdetectionsettings',
            name='camera',
            field=models.OneToOneField(default=None, on_delete=django.db.models.deletion.CASCADE, to='camera.camera'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='sounddetectionsettings',
            name='camera',
            field=models.OneToOneField(default=None, on_delete=django.db.models.deletion.CASCADE, to='camera.camera'),
            preserve_default=False,
        ),
    ]
