# Generated by Django 3.1.5 on 2021-01-23 02:47

import colorfield.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('overlay', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='overlay',
            name='color',
        ),
        migrations.AddField(
            model_name='overlay',
            name='background',
            field=colorfield.fields.ColorField(default='#000', max_length=18),
        ),
        migrations.AddField(
            model_name='overlay',
            name='foreground',
            field=colorfield.fields.ColorField(default='#FFF', max_length=18),
        ),
        migrations.AlterField(
            model_name='overlay',
            name='enabled',
            field=models.BooleanField(default=True),
        ),
    ]